using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  [Route("api/announcements")]
  [ApiController]
  public class AnnouncementController : ControllerBase
  {
    [HttpGet]
    public async Task<ActionResult<PagedResult<Announcement>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
  )
    {
      return await LookupService<Announcement>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Announcement>> Find(int id)
    {
      Announcement announcement = await LookupService<Announcement>.Find(id).ConfigureAwait(false);
      if (announcement == null) return NotFound();
      return Ok(announcement);
    }
  }
}
