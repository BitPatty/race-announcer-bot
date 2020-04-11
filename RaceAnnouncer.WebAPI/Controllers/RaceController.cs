using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  [Route("api/races")]
  [ApiController]
  public class RaceController : ControllerBase
  {
    [HttpGet]
    public async Task<ActionResult<PagedResult<Race>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
   )
    {
      return await LookupService<Race>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Race>> Find(int id)
    {
      Race race = await LookupService<Race>.Find(id).ConfigureAwait(false);
      if (race == null) return NotFound();
      return Ok(race);
    }
  }
}
