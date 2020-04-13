using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  [Route("api/entrants")]
  [ApiController]
  public class EntrantController : ControllerBase
  {
    [HttpGet]
    public async Task<ActionResult<PagedResult<Entrant>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
   )
    {
      return await LookupService<Entrant>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Entrant>> Find(long id)
    {
      Entrant entrant = await LookupService<Entrant>.Find(id).ConfigureAwait(false);
      if (entrant == null) return NotFound();
      return Ok(entrant);
    }
  }
}
