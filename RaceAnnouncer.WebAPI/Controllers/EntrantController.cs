using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  /// <summary>
  /// Handles requests on the /api/entrants endpoint
  /// </summary>
  [Route("api/entrants")]
  [ApiController]
  public class EntrantController : ControllerBase
  {
    /// <summary>
    /// List entrants
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/entrants
    /// </remarks>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size (1-10)</param>
    /// <returns>The paginated entrant list</returns>
    [HttpGet]
    public async Task<ActionResult<PagedResult<Entrant>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
   )
    {
      return await LookupService<Entrant>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    /// <summary>
    /// Find a specific entrant
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/entrants/1
    /// </remarks>
    /// <param name="id">The entrants id</param>
    /// <returns>The entrant</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<Entrant>> Find(long id)
    {
      Entrant entrant = await LookupService<Entrant>.Find(id).ConfigureAwait(false);
      if (entrant == null) return NotFound();
      return Ok(entrant);
    }
  }
}
