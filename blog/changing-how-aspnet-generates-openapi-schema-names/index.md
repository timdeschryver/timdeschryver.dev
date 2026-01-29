---
title: Changing how ASP.NET generates OpenAPI schema names
slug: changing-how-aspnet-generates-openapi-schema-names
description: Preventing any naming conflicts in the OpenAPI documentation by ensuring that each schema name is uniquely identified by its full name.
date: 2026-01-29
tags: .NET, OpenAPI
---

By default, [ASP.NET generates OpenAPI](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview) schema names based on the names of your models. However, there are scenarios where you might want to customize these names to better fit your API design. In my case, to avoid naming conflicts. In this post we'll explore how to change the way ASP.NET generates OpenAPI schema names.

## Setting up OpenAPI in ASP.NET

To enable OpenAPI in your ASP.NET application, you add the OpenAPI services and middleware using the `AddOpenApi` and `MapOpenApi` methods respectively:

```cs [title="Program.cs"] [highlight="2,7"]
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();
```

This generates an OpenAPI document that describes your API endpoints and models, which can be accessed at `/openapi/v1.json`.

## Naming Conflicts in OpenAPI Schemas

The problem I recently faced involved duplicate model names across different namespaces. For example, I had two classes named `ResponseData` in separate namespaces: `Project.ModuleA.ResponseData` and `Project.ModuleB.ResponseData`. When generating the OpenAPI documentation, both classes were represented as `ResponseData`, leading to conflicts.

This creates ambiguity in the API documentation and breaks code generation tools that rely on unique schema names.

As an example, take a look the following endpoints, which both return a `ResponseData` object from different namespaces:

```cs [title="Endpoints.cs"] [highlight="10-11"]
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/module-a", () => new Project.ModuleA.ResponseData("Hello from Module A", 100));
app.MapGet("/module-b", () => new Project.ModuleB.ResponseData("Hello from Module B", "Success", 67));

app.Run();
```

The above endpoints generates an OpenAPI document similar to the following one.
Within the `components/schemas` section, you'll notice that only the last occurence of the `ResponseData` model is documented, and both endpoints reference the same schema:

```json [title="before.json"] [highlight="24,43,54-73"]
{
	"openapi": "3.1.1",
	"info": {
		"title": "Project | v1",
		"version": "1.0.0"
	},
	"servers": [
		{
			"url": "http://localhost:5294/"
		}
	],
	"paths": {
		"/module-a": {
			"get": {
				"tags": ["Project"],
				"responses": {
					"200": {
						"description": "OK",
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/ResponseData"
								}
							}
						}
					}
				}
			}
		},
		"/module-b": {
			"get": {
				"tags": ["Project"],
				"responses": {
					"200": {
						"description": "OK",
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/ResponseData"
								}
							}
						}
					}
				}
			}
		}
	},
	"components": {
		"schemas": {
			"ResponseData": {
				"required": ["message", "code"],
				"type": "object",
				"properties": {
					"message": {
						"type": "string"
					},
					"code": {
						"pattern": "^-?(?:0|[1-9]\\d*)$",
						"type": ["integer", "string"],
						"format": "int32"
					}
				}
			}
		}
	},
	"tags": [
		{
			"name": "Project"
		}
	]
}
```

## Resolving Naming Conflicts using CreateSchemaReferenceId

This is not what we want. To resolve this, we can customize the schema naming strategy using the `CreateSchemaReferenceId` option when configuring OpenAPI in ASP.NET.

```cs [title="Program.cs"]
builder.Services.AddOpenApi(options =>
{
    options.CreateSchemaReferenceId = (type) =>
    {
        var schemaRefId = OpenApiOptions.CreateDefaultSchemaReferenceId(type);
        // Ignore primitive types
        if (schemaRefId is null)
        {
            return null;
        }

        // Replace '+' with '.' to handle nested types
        return type.Type.FullName.Replace("+", ".", StringComparison.Ordinal);
    };
});
```

With this configuration, the `CreateSchemaReferenceId` method generates schema names that include the full namespace of the model, effectively avoiding naming conflicts. Once you apply this change, the generated OpenAPI document will look like this:

```json [title="after.json"] [highlight="24,43,54-97"]
{
	"openapi": "3.1.1",
	"info": {
		"title": "Project | v1",
		"version": "1.0.0"
	},
	"servers": [
		{
			"url": "http://localhost:5294/"
		}
	],
	"paths": {
		"/module-a": {
			"get": {
				"tags": ["Project"],
				"responses": {
					"200": {
						"description": "OK",
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/Project.ModuleA.ResponseData"
								}
							}
						}
					}
				}
			}
		},
		"/module-b": {
			"get": {
				"tags": ["Project"],
				"responses": {
					"200": {
						"description": "OK",
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/Project.ModuleB.ResponseData"
								}
							}
						}
					}
				}
			}
		}
	},
	"components": {
		"schemas": {
			"Project.ModuleA.ResponseData": {
				"required": ["message", "code"],
				"type": "object",
				"properties": {
					"message": {
						"type": "string"
					},
					"code": {
						"pattern": "^-?(?:0|[1-9]\\d*)$",
						"type": ["integer", "string"],
						"format": "int32"
					}
				}
			},
			"Project.ModuleB.ResponseData": {
				"required": ["description", "status", "value"],
				"type": "object",
				"properties": {
					"description": {
						"type": "string"
					},
					"status": {
						"type": "string"
					},
					"value": {
						"pattern": "^-?(?:0|[1-9]\\d*)$",
						"type": ["integer", "string"],
						"format": "int32"
					}
				}
			}
		}
	},
	"tags": [
		{
			"name": "Project"
		}
	]
}
```
