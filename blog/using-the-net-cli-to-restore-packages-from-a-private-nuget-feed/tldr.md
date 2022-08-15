## Install the [Microsoft NuGet CredentialProvider](https://github.com/Microsoft/artifacts-credprovider#setup)

```sh
# On Windows
iex "& { $(irm https://aka.ms/install-artifacts-credprovider.ps1) }"
# On Linux
wget -qO- https://aka.ms/install-artifacts-credprovider.sh | bash
```

## Run the restore .NET command in interactive mode

```sh
dotnet restore --interactive
```
