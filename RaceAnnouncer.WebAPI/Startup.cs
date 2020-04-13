using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using RaceAnnouncer.Schema;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI
{
  /// <summary>
  /// Web Entrypoint
  /// </summary>
  public class Startup
  {
    /// <summary>
    /// Startup
    /// </summary>
    /// <param name="configuration">The host configuration</param>
    public Startup(IConfiguration configuration)
    {
      Configuration = configuration;
    }

    /// <summary>
    /// The host configuration
    /// </summary>
    public IConfiguration Configuration { get; }

    /// <summary>
    /// Configure the services
    /// </summary>
    /// <param name="services"></param>
    public void ConfigureServices(IServiceCollection services)
    {
      services.AddAuthentication("BasicAuthentication")
        .AddScheme<AuthenticationSchemeOptions, APIAuthService>("BasicAuthentication", null);

      services.AddDbContext<DatabaseContext>();
      services.AddLogging();
      services.AddMvc();
      services.AddCloudscribePagination();
      services.AddControllers();

      services.AddSwaggerGen(c =>
      {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
          Version = "v1",
          Title = "Race Announcer Bot API",
          Description = "A REST API for managing the race announcer bot",
          Contact = new OpenApiContact
          {
            Name = "Matteias Collet",
            Email = "matteias.collet@pm.me",
            Url = new Uri("https://github.com/BitPatty"),
          },
          License = new OpenApiLicense
          {
            Name = "Use under AGPL-v3",
            Url = new Uri("https://github.com/BitPatty/RaceAnnouncerBot/blob/master/LICENSE"),
          }
        });

        c.AddSecurityDefinition("basicAuth", new OpenApiSecurityScheme
        {
          Type = SecuritySchemeType.Http,
          Scheme = "basic",
          Description = "Input your username and password to perform data manipulations",
          In = ParameterLocation.Header,
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
          {
            new OpenApiSecurityScheme
            {
              Reference = new OpenApiReference
              {
                  Type = ReferenceType.SecurityScheme,
                  Id = "basicAuth"
              }
            }, new List<string>()
          }
        });

        string xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        string xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        c.IncludeXmlComments(xmlPath);
      });
    }

    /// <summary>
    /// Configure the app
    /// </summary>
    /// <param name="app">The app builder</param>
    /// <param name="env">The environment helper</param>
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
      if (env.IsDevelopment())
      {
        app.UseDeveloperExceptionPage();
      }

      app.UseSwagger();
      app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Race Announcer Bot API V1"));

      app.UseStaticFiles(new StaticFileOptions
      {
        FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "StaticFiles")),
        RequestPath = "/StaticFiles"
      });

      app.UseHttpsRedirection();
      app.UseRouting();
      app.UseAuthentication();
      app.UseAuthorization();

      app.UseEndpoints(endpoints => endpoints.MapControllers());
    }
  }
}
