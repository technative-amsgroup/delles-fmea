{
  description = "A Node.js and Yarn development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      # Keep the original packages
      #packages.${system}.hello = pkgs.hello;
      #packages.${system}.default = self.packages.${system}.hello;

      # Add a development shell with Node.js and Yarn
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs
          yarn
        ];

        shellHook = ''
          echo "Node.js $(${pkgs.nodejs}/bin/node --version) and Yarn $(${pkgs.yarn}/bin/yarn --version) development environment"
        '';
      };
    };
}
