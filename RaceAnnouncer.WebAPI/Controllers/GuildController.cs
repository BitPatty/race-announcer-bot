using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  /// <summary>
  /// Handles requests on the /api/guilds endpoint
  /// </summary>
  [Route("api/guilds")]
  [ApiController]
  public class GuildController : ControllerBase
  {
    /// <summary>
    /// List guilds
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/guilds
    /// </remarks>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size (1-10)</param>
    /// <returns>The paginated guild list</returns>
    [HttpGet]
    public async Task<ActionResult<PagedResult<Guild>>> Get(
     [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
     , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
   )
    {
      return await LookupService<Guild>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    /// <summary>
    /// Find a specific guild
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/guilds/1
    /// </remarks>
    ///  /// <param name="id">The guilds id</param>
    /// <returns>The guild</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<Guild>> Find(long id)
    {
      Guild guild = await LookupService<Guild>.Find(id).ConfigureAwait(false);
      if (guild == null) return NotFound();
      return Ok(guild);
    }
  }
}
