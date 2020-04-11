using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  [Route("api/guilds")]
  [ApiController]
  public class GuildController : ControllerBase
  {
    [HttpGet]
    public async Task<ActionResult<PagedResult<Guild>>> Get(
     [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
     , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
   )
    {
      return await LookupService<Guild>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Guild>> Find(int id)
    {
      Guild guild = await LookupService<Guild>.Find(id).ConfigureAwait(false);
      if (guild == null) return NotFound();
      return Ok(guild);
    }
  }
}
