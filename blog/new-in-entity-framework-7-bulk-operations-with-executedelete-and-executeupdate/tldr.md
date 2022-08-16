```cs{5-7, 9-13}
using (var context = new NewInEFContext())
{
    SetupAndPopulate(context);

    context.Persons
        .Where(p => p.PersonId <= 500)
        .ExecuteDelete();

    context.Persons
        .Where(p => p.PersonId <= 1_000)
        .ExecuteUpdate(p =>
            p.SetProperty(x => x.LastName, x => "Updated" + x.LastName)
             .SetProperty(x => x.FirstName, x => "Updated" + x.FirstName));
}
```
