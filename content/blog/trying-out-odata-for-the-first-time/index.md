---
title: Trying out OData for the first time
slug: trying-out-odata-for-the-first-time
description: What advantages does OData bring and why should we use it?
author: Tim Deschryver
date: 2022-03-21
tags: .NET, OData, csharp
banner: ./images/banner.jpg
published: true
---

Although OData exists for more than 10 years, I've only heard about it just earlier this week.
During a session on the [dotNET YouTube channel](https://www.youtube.com/channel/UCvtT19MZW8dq5Wwfu6B0oxw), [Hassan Habib](https://twitter.com/hassanrezkhabib) talked about [What's new in OData: $compute](https://www.youtube.com/watch?v=VFunAvbrZeQ).
This was my first introduction to OData, and I was immediately hooked, I had to try it out on my own.

## What is OData

Taken from the [OData website](https://www.odata.org/), OData is described as:

> OData (Open Data Protocol) is an ISO/IEC approved, OASIS standard that defines a set of best practices for building and consuming RESTful APIs. OData helps you focus on your business logic while building RESTful APIs without having to worry about the various approaches to define request and response headers, status codes, HTTP methods, URL conventions, media types, payload formats, query options, etc. OData also provides guidance for tracking changes, defining functions/actions for reusable procedures, and sending asynchronous/batch requests.
> OData RESTful APIs are easy to consume. The OData metadata, a machine-readable description of the data model of the APIs, enables the creation of powerful generic client proxies and tools.

In my own words from what I've seen from it so far, I would describe OData as REST on steroids.
The server provides a resource endpoint to its consumers with querying capabilities out of the box.
If you're familiar with GraphQL, this should sound familiar.

OData simplifies and reduces the amount of code to communicate between a client and the server, without introducing complexity. Making it a win-win for the client and the server, and this also results in a better experience for the end-users.

### Examples

Without going into the details, let's compare a normal REST endpoint with a REST endpoint that's "OData-fied".
Invoking the students' endpoint `/students` results in the following response, an array of students.

```json:/students
[
    {
        "id": 1,
        "lastName": "Alexander",
        "firstMidName": "Carson",
        "enrollmentDate": "2005-09-01T00:00:00",
        "enrollments": null
    },
    {
        "id": 2,
        "lastName": "Alonso",
        "firstMidName": "Meredith",
        "enrollmentDate": "2002-09-01T00:00:00",
        "enrollments": null
    },
    {
        "id": 3,
        "lastName": "Anand",
        "firstMidName": "Arturo",
        "enrollmentDate": "2003-09-01T00:00:00",
        "enrollments": null
    },
    {
        "id": 4,
        "lastName": "Barzdukas",
        "firstMidName": "Gytis",
        "enrollmentDate": "2002-09-01T00:00:00",
        "enrollments": null
    },
    {
        "id": 5,
        "lastName": "Li",
        "firstMidName": "Yan",
        "enrollmentDate": "2002-09-01T00:00:00",
        "enrollments": null
    },
    {
        "id": 6,
        "lastName": "Justice",
        "firstMidName": "Peggy",
        "enrollmentDate": "2001-09-01T00:00:00",
        "enrollments": null
    },
    {
        "id": 7,
        "lastName": "Norman",
        "firstMidName": "Laura",
        "enrollmentDate": "2003-09-01T00:00:00",
        "enrollments": null
    },
    {
        "id": 8,
        "lastName": "Olivetto",
        "firstMidName": "Nino",
        "enrollmentDate": "2005-09-01T00:00:00",
        "enrollments": null
    }
]
```

Now, let's invoke the OData equivalent `/orest/students`, which gives us the following response.

```json:/orest/students
{
    "@odata.context": "https://localhost:7103/orest/$metadata#Students",
    "value": [
        {
            "id": 1,
            "lastName": "Alexander",
            "firstMidName": "Carson",
            "enrollmentDate": "2005-09-01T00:00:00+02:00"
        },
        {
            "id": 2,
            "lastName": "Alonso",
            "firstMidName": "Meredith",
            "enrollmentDate": "2002-09-01T00:00:00+02:00"
        },
        {
            "id": 3,
            "lastName": "Anand",
            "firstMidName": "Arturo",
            "enrollmentDate": "2003-09-01T00:00:00+02:00"
        },
        {
            "id": 4,
            "lastName": "Barzdukas",
            "firstMidName": "Gytis",
            "enrollmentDate": "2002-09-01T00:00:00+02:00"
        },
        {
            "id": 5,
            "lastName": "Li",
            "firstMidName": "Yan",
            "enrollmentDate": "2002-09-01T00:00:00+02:00"
        },
        {
            "id": 6,
            "lastName": "Justice",
            "firstMidName": "Peggy",
            "enrollmentDate": "2001-09-01T00:00:00+02:00"
        },
        {
            "id": 7,
            "lastName": "Norman",
            "firstMidName": "Laura",
            "enrollmentDate": "2003-09-01T00:00:00+02:00"
        },
        {
            "id": 8,
            "lastName": "Olivetto",
            "firstMidName": "Nino",
            "enrollmentDate": "2005-09-01T00:00:00+02:00"
        }
    ]
}
```

No big changes so far, only that the students' array is wrapped within the OData context.
Nothing special, but now the fun can start.

We can use the OData expression syntax and append query parameters to the endpoint URL to change the behavior of the response.

As an example, let's make a change to the student's endpoint to only include the students' first and last names.

```json:/orest/students?select=firstMidName,lastName
{
    "@odata.context": "https://localhost:7103/orest/$metadata#Students(id,firstMidName,lastName)",
    "value": [
        {
            "lastName": "Alexander",
            "firstMidName": "Carson"
        },
        {
            "lastName": "Alonso",
            "firstMidName": "Meredith"
        },
        {
            "lastName": "Anand",
            "firstMidName": "Arturo"
        },
        {
            "lastName": "Barzdukas",
            "firstMidName": "Gytis"
        },
        {
            "lastName": "Li",
            "firstMidName": "Yan"
        },
        {
            "lastName": "Justice",
            "firstMidName": "Peggy"
        },
        {
            "lastName": "Norman",
            "firstMidName": "Laura"
        },
        {
            "lastName": "Olivetto",
            "firstMidName": "Nino"
        }
    ]
}
```

Now that we've seen a first example, how difficult do you think it would be to filter the above results to only include students that start with "A" as the last name?

Right, you've probably guessed it, not that hard.

```json:/orest/students?select=firstMidName,lastName&filter=startsWith(lastName, 'A')
{
    "@odata.context": "https://localhost:7103/orest/$metadata#Students(firstMidName,lastName)",
    "value": [
        {
            "lastName": "Alexander",
            "firstMidName": "Carson"
        },
        {
            "lastName": "Alonso",
            "firstMidName": "Meredith"
        },
        {
            "lastName": "Anand",
            "firstMidName": "Arturo"
        }
    ]
}
```

Was I correct by telling you this would be easy?

Let's take it a step further and only select two students while skipping the first student ordered by their name, and you know what, let's throw in a total count in as well.

```json:/orest/students?select=firstMidName,lastName&filter=startsWith(lastName, 'A')&orderBy=lastName&take=2&skip=1&count=true
{
    "@odata.context": "https://localhost:7103/orest/$metadata#Students(firstMidName,lastName)",
    "@odata.count": 3,
    "value": [
        {
            "lastName": "Alonso",
            "firstMidName": "Meredith"
        },
        {
            "lastName": "Anand",
            "firstMidName": "Arturo"
        }
    ]
}
```

Most entities also include nested objects, and with OData you can also select these objects.
In our example, a student is enrolled in courses.
Let's take a look at what this query looks like.

```json:/orest/students?select=firstMidName,lastName&filter=startsWith(lastName, 'A')&orderBy=lastName&take=2&skip=1&count=true&expand=Enrollments(expand=Course(select=title);select=Grade)
{
    "@odata.context": "https://localhost:7103/orest/$metadata#Students(firstMidName,lastName,enrollments(grade,course(title)))",
    "@odata.count": 3,
    "value": [
        {
            "lastName": "Alonso",
            "firstMidName": "Meredith",
            "enrollments": [
                {
                    "grade": "B",
                    "course": {
                        "title": "Calculus"
                    }
                },
                {
                    "grade": "F",
                    "course": {
                        "title": "Trigonometry"
                    }
                },
                {
                    "grade": "F",
                    "course": {
                        "title": "Composition"
                    }
                }
            ]
        },
        {
            "lastName": "Anand",
            "firstMidName": "Arturo",
            "enrollments": [
                {
                    "grade": null,
                    "course": {
                        "title": "Chemistry"
                    }
                }
            ]
        }
    ]
}
```

## Adding OData to an endpoint

These examples are great, but the best part is yet to come.
How many lines of code do you think it requires to build these endpoints?

The answer to that question is zero lines of code.
Yes, zero lines of code.

The students' controller has a single GET endpoint that's decorated with the `[EnableQuery]` attribute, and returns an `IQueryable<Student>`.

```cs{2, 16-20}:Controllers/StudentsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;

[ApiController]
[Route("[controller]")]
public class StudentsController : ControllerBase
{
    private readonly DbContext _context;

    public StudentsController(DbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [EnableQuery]
    public ActionResult<IQueryable<Student>> Get()
    {
        return Ok(_context.Students);
    }
}
```

But it even gets better.
At first, I thought that the complete result set was taken in memory and that it was mutated into the result.
But what blows my mind, is that because I'm using Entity Framework, the OData query syntax is translated into a SQL statement. This means that we're only selecting the bare minimum, which makes it not only convenient but also performant.

For example, the endpoint to select the paginated student names is translated into the following SQL query.

```sql
SELECT [s].[FirstMidName], [s].[LastName], [s].[ID]
FROM [Students] AS [s]
WHERE (@__TypedProperty_0 = N'') OR (LEFT([s].[LastName], LEN(@__TypedProperty_0)) = @__TypedProperty_0)
ORDER BY [s].[LastName], [s].[ID]
OFFSET @__TypedProperty_2 ROWS
```

## How to add OData to your ASP.NET Web API

Ok, to be fair I haven't been totally honest with you.
OData does require some lines of code to set it up.
The good thing is, that this only takes a few minutes of your time.

The first step is to install the `Microsoft.AspNetCore.OData` NuGet package.

```bash
dotnet add package Microsoft.AspNetCore.OData
```

Next, OData needs to be added to the Api controllers.
Lastly, a model builder is created to build an EDM (Entity Data Model), which acts as a schema to your model and wraps the results with the OData metadata wrapper. The EDM is available at the `/orest/$metadata` endpoint.

And, that's it.

```cs{3-4,9-12,39-45}:Program.cs
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Microsoft.OData.Edm;
using Microsoft.OData.ModelBuilder;

var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddControllers()
    .AddOData(options =>
    {
        options.EnableQueryFeatures().AddRouteComponents("orest", GetEdmModel());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<SandboxContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SandboxDB")));
builder.Services.AddDatabaseDeveloperPageExceptionFilter();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<SandboxContext>();
    context.Database.EnsureCreated();
    Seed.Init(context);
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();

static IEdmModel GetEdmModel()
{
    var builder = new ODataConventionModelBuilder();
    builder.EnableLowerCamelCase();
    builder.EntitySet<Student>("Students");
    return builder.GetEdmModel();
}
```

## Conclusion

So why should we use OData?

I've only spent a few hours with OData, but this seems to be useful in many cases.
Without OData we have to write all of the query code manually.
Think about the time that could've been saved on your project if you didn't need to write and maintain this code.
Not only the production code but also the code that it requires to test it.
And what about the meetings between two teams to implement these features and to make modifications to them.

Besides the productivity boost, in most cases, this has a positive impact on the performance of your application.
Far too often I've seen that a client retrieves too much information from the server and that it needs to add its own logic to filter or enhance the result set. This has two costs, the initial amount of data that needs to be downloaded, and the memory consumption on the client-side which can be bigger than we initially think depending on the client's specifications, e.g. a brand-new desktop VS an older phone with a low bandwidth connection.
With an OData Endpoint, we can move all of this logic back to the server, which we're in control and we can make sure that it can handle the workload.

Besides the client-side dangers, writing the query logic server-side also has its own caveats.
Just like on the client-side, we can retrieve too much data from the SQL server, we can write a slow query, or on rare occasions we can also introduce a bug. I'm positive to think that the generated queries are often better or equal compared to the queries that we would write on our own.

Said in short, OData simplifies and reduces the amount of code to communicate between a client and the server, without introducing complexity.

I'm looking forward to giving OData a spin on a real project.

The examples from this blog are available at [timdeschryver/ODataSandboxApi](https://github.com/timdeschryver/ODataSandboxApi), which you can also use to try OData out for yourselves.
