```csharp{2, 9, 15, 21}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient<IStarWarsService, StarWarsHttpClient>();

var app = builder.Build();

var starwarsGroup = app.MapGroup("starwars");
starwarsGroup.MapGet("people/{peopleId}", async (string peopleId, IStarWarsService starwarsService) =>
{
    var people = await starwarsService.GetPeople(peopleId);
    return Results.Ok(people);
});

starwarsGroup.MapGet("species/{speciesId}", async (string speciesId, IStarWarsService starwarsService) =>
{
    var species = await starwarsService.GetSpecies(speciesId);
    return Results.Ok(species);
});

starwarsGroup.MapGet("planets/{planetId}", async (string planetId, IStarWarsService starwarsService) =>
{
    var planet = await starwarsService.GetPlanet(planetId);
    return Results.Ok(planet);
});

app.Run();

public class StarWarsHttpClient : IStarWarsService
{
    private readonly HttpClient _httpClient;

    public StarWarsHttpClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://swapi.dev/api/");
    }

    public async ValueTask<StarWarsPeople> GetPeople(string peopleId)
    {
        return await _httpClient.GetFromJsonAsync<StarWarsPeople>($"people/{peopleId}");
    }

    public async ValueTask<StarWarsPlanet> GetPlanet(string planetId)
    {
        return await _httpClient.GetFromJsonAsync<StarWarsPlanet>($"planets/{planetId}");
    }

    public async ValueTask<StarWarsSpecies> GetSpecies(string speciesId)
    {
        return await _httpClient.GetFromJsonAsync<StarWarsSpecies>($"species/{speciesId}");

    }
}

public interface IStarWarsService
{
    ValueTask<StarWarsPeople> GetPeople(string peopleId);
    ValueTask<StarWarsPlanet> GetPlanet(string planetId);
    ValueTask<StarWarsSpecies> GetSpecies(string speciesId);
}
```
