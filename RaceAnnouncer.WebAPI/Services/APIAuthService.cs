using System;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models;

namespace RaceAnnouncer.WebAPI.Services
{
  /// <summary>
  /// Enables BASIC authentication against the API
  /// </summary>
  public class APIAuthService : AuthenticationHandler<AuthenticationSchemeOptions>
  {
    /// <summary>
    /// Creates a new instance of the <see cref="APIAuthService"/>
    /// </summary>
    /// <param name="options">The authentication options</param>
    /// <param name="logger">The logger factory</param>
    /// <param name="encoder">The url encoder</param>
    /// <param name="clock">The system clock</param>
    public APIAuthService(
      IOptionsMonitor<AuthenticationSchemeOptions> options
      , ILoggerFactory logger
      , UrlEncoder encoder
      , ISystemClock clock
    )
    : base(options, logger, encoder, clock) { }

    /// <summary>
    /// Handles an authentication request
    /// </summary>
    /// <returns>Returns the AuthenticateResult</returns>
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
      if (!Request.Headers.ContainsKey("Authorization"))
        return AuthenticateResult.Fail("Missing Authorization Header");

      try
      {
        AuthenticationHeaderValue authHeader = AuthenticationHeaderValue.Parse(Request.Headers["Authorization"]);

        ParseCredentials(authHeader, out string username, out string secret);

        if (username == null || secret == null)
          return AuthenticateResult.Fail("Invalid Credentials");

        APIUser? user = await Authenticate(username, secret).ConfigureAwait(false);

        if (user == null) return AuthenticateResult.Fail("Invalid Credentials");

        AuthenticationTicket ticket = CreateTicket(user);
        return AuthenticateResult.Success(ticket);
      }
      catch
      {
        return AuthenticateResult.Fail("Invalid Credentials");
      }
    }

    /// <summary>
    /// Parse the base64 encoded credentials
    /// </summary>
    /// <param name="authHeader">The authorization header containing the credentials</param>
    /// <param name="username">The username</param>
    /// <param name="secret">The secret</param>
    private void ParseCredentials(AuthenticationHeaderValue authHeader, out string username, out string secret)
    {
      byte[] credentialBytes = Convert.FromBase64String(authHeader.Parameter);
      string[] credentials = Encoding.UTF8.GetString(credentialBytes).Split(new[] { ':' }, 2);
      username = credentials[0];
      secret = credentials[1];
    }

    /// <summary>
    /// Creates a new authentication ticket
    /// </summary>
    /// <param name="user">The user to create a ticket for</param>
    /// <returns>Returns a new AuthenticationTicket for the provided user</returns>
    private AuthenticationTicket CreateTicket(APIUser user)
    {
      Claim[] claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
            };
      ClaimsIdentity identity = new ClaimsIdentity(claims, Scheme.Name);
      ClaimsPrincipal principal = new ClaimsPrincipal(identity);
      return new AuthenticationTicket(principal, Scheme.Name);
    }

    /// <summary>
    /// Authenticates a user against the credentials stored in the database
    /// </summary>
    /// <param name="username">The username</param>
    /// <param name="secret">The secret</param>
    /// <returns>Returns the user if a match is found</returns>
    private async Task<APIUser?> Authenticate(string username, string secret)
    {
      using DatabaseContext context = new ContextBuilder().CreateDbContext();

      APIUser? user = await context
        .APIUsers
        .SingleOrDefaultAsync(u => u
          .Username
          .Equals(username, StringComparison.InvariantCultureIgnoreCase))
        .ConfigureAwait(false);

      if (user == null) return null;
      if (String.IsNullOrWhiteSpace(user.APIKey)) return null;
      if (user.ExpiresAt < DateTime.Now) return null;
      if (!BCrypt.Net.BCrypt.Verify(secret, user.APIKey)) return null;

      return user;
    }
  }
}
