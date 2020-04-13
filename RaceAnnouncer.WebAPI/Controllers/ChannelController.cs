using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  /// <summary>
  /// Handles requests on the /api/channels endpoint
  /// </summary>
  [Route("api/channels")]
  [ApiController]
  public class ChannelController : ControllerBase
  {
    /// <summary>
    /// List channels
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/channels
    /// </remarks>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size (1-10)</param>
    /// <returns>The paginated channel list</returns>
    [HttpGet]
    public async Task<ActionResult<PagedResult<Channel>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
   )
    {
      return await LookupService<Channel>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    /// <summary>
    /// Find a specific channel
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/channels/1
    /// </remarks>
    ///  /// <param name="id">The channels id</param>
    /// <returns>The channel</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<Channel>> Find(long id)
    {
      Channel channel = await LookupService<Channel>.Find(id).ConfigureAwait(false);
      if (channel == null) return NotFound();
      return Ok(channel);
    }
  }
}
