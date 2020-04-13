using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  [Route("api/channels")]
  [ApiController]
  public class ChannelController : ControllerBase
  {
    [HttpGet]
    public async Task<ActionResult<PagedResult<Channel>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
   )
    {
      return await LookupService<Channel>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Channel>> Find(long id)
    {
      Channel channel = await LookupService<Channel>.Find(id).ConfigureAwait(false);
      if (channel == null) return NotFound();
      return Ok(channel);
    }
  }
}
