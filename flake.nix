{
  description = "dictadraw: dictate an illustration in chat; a coding agent draws it";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs =
    { self, nixpkgs }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          # The toolchain CI installs; the dev shell adds to it.
          ci = pkgs.buildEnv {
            name = "dictadraw-ci-tools";
            paths = [
              pkgs.nodejs_26
              pkgs.pnpm_12
              pkgs.npm-check-updates
              pkgs.gh
              pkgs.git
            ];
          };
        }
      );

      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = [
              self.packages.${system}.ci
              # magick, for inspecting renders and converting them for print
              pkgs.imagemagick
            ];
          };
        }
      );
    };
}
