{
  pkgs,
  ...
}:

{
  packages = [
    pkgs.git
    pkgs.bashInteractive
    pkgs.pandoc
    pkgs.quartoMinimal
  ];

  languages = {
    texlive = {
      enable = true;
      base = pkgs.texliveMedium;
    };

    javascript = {
      enable = true;

      corepack.enable = true;

      pnpm = {
        enable = true;

        install = {
          enable = true;
        };
      };
    };

    typescript = {
      enable = true;
    };
  };

  treefmt = {
    enable = true;

    config.programs = {
      nixfmt.enable = true;

      prettier = {
        enable = true;

        settings = {
          proseWrap = "always";
        };
      };

      stylua.enable = true;
    };
  };

  git-hooks.hooks = {
    treefmt.enable = true;
    eslint.enable = true;
  };
}
