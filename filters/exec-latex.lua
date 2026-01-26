-- exec-latex.lua
-- Pandoc Lua filter to execute LaTeX code blocks and include rendered output
-- Similar to how Quarto executes R/Python/Julia code
--
-- Usage in Markdown:
--   ```{latex exec=true}
--   \tikz \draw (0,0) circle (1cm);
--   ```
--
-- Options:
--   exec=true         - Enable execution
--   width="50%"       - Image width
--   height="100px"    - Image height
--   caption="..."     - Figure caption
--   dpi=300           - Output resolution
--   engine="pdflatex" - LaTeX engine (pdflatex, xelatex, lualatex)
--   crop=true         - Auto-crop whitespace (default: true)

-- Configuration (can be overridden via metadata)
local config = {
	cache_dir = "_latex_cache",
	default_dpi = 300,
	default_engine = "pdflatex",
	auto_crop = true,
	debug = false,
	-- Packages to include when wrapping standalone snippets
	default_packages = { "tikz", "pgfplots" },
}

-- Utility: Check if file exists
local function file_exists(path)
	local f = io.open(path, "r")
	if f then
		f:close()
		return true
	end
	return false
end

-- Utility: Write content to file
local function write_file(path, content)
	local f = io.open(path, "w")
	if not f then
		error("Cannot write to file: " .. path)
	end
	f:write(content)
	f:close()
end

-- Utility: Execute shell command
local function exec(cmd)
	if config.debug then
		io.stderr:write("[DEBUG] Executing: " .. cmd .. "\n")
	end
	local handle = io.popen(cmd .. " 2>&1")
	local result = handle:read("*a")
	local success = handle:close()
	return success, result
end

-- Check for required dependencies
local function check_dependencies()
	local deps = {
		pdflatex = "pdflatex --version > /dev/null 2>&1",
		convert = "convert --version > /dev/null 2>&1",
	}

	local missing = {}
	for name, cmd in pairs(deps) do
		local success = os.execute(cmd)
		if not success or success ~= 0 then
			table.insert(missing, name)
		end
	end

	if #missing > 0 then
		io.stderr:write(
			string.format("Warning: Missing dependencies for exec-latex filter: %s\n", table.concat(missing, ", "))
		)
		io.stderr:write("LaTeX code blocks with exec=true will not be processed.\n")
		return false
	end

	return true
end

-- Wrap code in standalone document if needed
local function wrap_standalone(code, packages)
	-- Check if already a complete document
	if code:match("\\documentclass") then
		return code
	end

	-- Build package list
	local pkg_lines = ""
	for _, pkg in ipairs(packages or config.default_packages) do
		pkg_lines = pkg_lines .. "\\usepackage{" .. pkg .. "}\n"
	end

	return string.format(
		[[
\documentclass[crop,tikz,border=2pt]{standalone}
%s
\begin{document}
%s
\end{document}
]],
		pkg_lines,
		code
	)
end

-- Compile LaTeX code to PDF
local function compile_latex(tex_file, engine)
	local cache_dir = config.cache_dir
	local compile_cmd = string.format(
		"%s -interaction=nonstopmode -halt-on-error -output-directory=%s %s",
		engine or config.default_engine,
		cache_dir,
		tex_file
	)

	local success, output = exec(compile_cmd)

	if not success then
		io.stderr:write("LaTeX compilation failed:\n")
		io.stderr:write(output .. "\n")
		return false, output
	end

	return true, output
end

-- Convert PDF to PNG using ImageMagick
local function pdf_to_png(pdf_file, png_file, dpi, crop)
	local density = dpi or config.default_dpi
	local crop_flag = (crop == nil and config.auto_crop) or crop

	local convert_cmd = string.format(
		"convert -density %d %s %s -quality 90 %s",
		density,
		pdf_file,
		crop_flag and "-trim +repage" or "",
		png_file
	)

	local success, output = exec(convert_cmd)

	if not success then
		io.stderr:write("PDF to PNG conversion failed:\n")
		io.stderr:write(output .. "\n")
		return false
	end

	return true
end

-- Main compilation function
local function compile_latex_to_image(latex_code, options)
	-- Generate unique hash for caching
	local hash = pandoc.sha1(latex_code .. (options.engine or ""))
	local cache_dir = config.cache_dir
	local base_name = cache_dir .. "/" .. hash
	local tex_file = base_name .. ".tex"
	local pdf_file = base_name .. ".pdf"
	local png_file = base_name .. ".png"

	-- Create cache directory
	os.execute("mkdir -p " .. cache_dir)

	-- Check if already compiled
	if file_exists(png_file) then
		if config.debug then
			io.stderr:write("[DEBUG] Using cached image: " .. png_file .. "\n")
		end
		return png_file
	end

	-- Wrap in standalone if needed
	local full_doc = wrap_standalone(latex_code, options.packages)

	-- Write LaTeX file
	write_file(tex_file, full_doc)

	-- Compile LaTeX to PDF
	local success, output = compile_latex(tex_file, options.engine)
	if not success then
		return nil, output
	end

	-- Check if PDF was created
	if not file_exists(pdf_file) then
		io.stderr:write("PDF file not created: " .. pdf_file .. "\n")
		return nil
	end

	-- Convert PDF to PNG
	success = pdf_to_png(pdf_file, png_file, options.dpi, options.crop)
	if not success then
		return nil
	end

	-- Clean up intermediate files (keep PDF for debugging)
	if not config.debug then
		os.execute(string.format("rm -f %s.aux %s.log", base_name, base_name))
	end

	return png_file
end

-- Initialize: Check dependencies once
local deps_ok = check_dependencies()

-- Main filter function
function CodeBlock(block)
	-- Only process if dependencies are available
	if not deps_ok then
		return block
	end

	-- Check if it's an executable LaTeX block
	local is_latex = block.classes:includes("latex")
	local should_exec = block.attributes.exec == "true"
		or block.attributes.exec == "1"
		or block.attributes.exec == "yes"

	if not (is_latex and should_exec) then
		return block
	end

	-- Extract options from attributes
	local options = {
		width = block.attributes.width,
		height = block.attributes.height,
		caption = block.attributes.caption,
		dpi = tonumber(block.attributes.dpi),
		engine = block.attributes.engine,
		crop = block.attributes.crop ~= "false",
		packages = nil, -- TODO: Parse from attribute
	}

	-- Compile LaTeX to image
	local image_path, error_msg = compile_latex_to_image(block.text, options)

	if not image_path then
		-- Compilation failed - return code block with error styling
		block.classes:insert("latex-error")
		local error_div = pandoc.Div({
			pandoc.Para({ pandoc.Strong({ pandoc.Str("LaTeX Compilation Error:") }) }),
			block,
			pandoc.Para({ pandoc.Emph({ pandoc.Str("See stderr for details.") }) }),
		}, pandoc.Attr("", { "callout-error" }))
		return error_div
	end

	-- Build image attributes
	local img_attr = {}
	if options.width then
		img_attr.width = options.width
	end
	if options.height then
		img_attr.height = options.height
	end

	-- Create image element
	local image = pandoc.Image(
		{}, -- no alt text by default
		image_path,
		"", -- no title
		pandoc.Attr("", { "latex-output" }, img_attr)
	)

	-- Wrap in figure with caption if provided
	if options.caption then
		return pandoc.Figure({ pandoc.Plain({ image }) }, { pandoc.Plain({ pandoc.Str(options.caption) }) })
	else
		return pandoc.Para({ image })
	end
end

-- Read configuration from document metadata
function Meta(meta)
	if meta["exec-latex"] then
		local user_config = meta["exec-latex"]

		if user_config["cache-dir"] then
			config.cache_dir = pandoc.utils.stringify(user_config["cache-dir"])
		end
		if user_config["dpi"] then
			config.default_dpi = tonumber(pandoc.utils.stringify(user_config["dpi"]))
		end
		if user_config["engine"] then
			config.default_engine = pandoc.utils.stringify(user_config["engine"])
		end
		if user_config["debug"] then
			config.debug = user_config["debug"]
		end
	end

	return meta
end

return {
	{ Meta = Meta },
	{ CodeBlock = CodeBlock },
}
