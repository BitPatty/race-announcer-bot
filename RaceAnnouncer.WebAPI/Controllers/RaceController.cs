using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  /// <summary>
  /// Handles requests on the /api/races endpoint
  /// </summary>
  [Route("api/races")]
  [ApiController]
  public class RaceController : ControllerBase
  {
    /// <summary>
    /// List races
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/races
    /// </remarks>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size (1-10)</param>
    /// <returns>The paginated race list</returns>
    [HttpGet]
    public async Task<ActionResult<PagedResult<Race>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
   )
    {
      return await LookupService<Race>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    /// <summary>
    /// Find a specific race
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/races/:id
    /// </remarks>
    ///  /// <param name="id">The races id</param>
    /// <returns>The race</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<Race>> Find(long id)
    {
      Race race = await LookupService<Race>.Find(id).ConfigureAwait(false);
      if (race == null) return NotFound();
      return Ok(race);
    }
  }
}
