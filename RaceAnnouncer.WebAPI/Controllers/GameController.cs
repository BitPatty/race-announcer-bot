using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  [Route("api/games")]
  [ApiController]
  public class GameController : ControllerBase
  {
    [HttpGet]
    public async Task<ActionResult<PagedResult<Game>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
)
    {
      return await LookupService<Game>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Game>> Find(long id)
    {
      Game game = await LookupService<Game>.Find(id).ConfigureAwait(false);
      if (game == null) return NotFound();
      return Ok(game);
    }
  }
}
