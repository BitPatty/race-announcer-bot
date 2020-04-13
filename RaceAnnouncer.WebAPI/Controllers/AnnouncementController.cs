using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  /// <summary>
  /// Handles requests on the /api/announcements endpoint
  /// </summary>
  [Route("api/announcements")]
  [ApiController]
  public class AnnouncementController : ControllerBase
  {
    /// <summary>
    /// List announcements
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/announcements
    /// </remarks>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size (1-10)</param>
    /// <returns>The paginated announcement list</returns>
    [HttpGet]
    public async Task<ActionResult<PagedResult<Announcement>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
  )
    {
      return await LookupService<Announcement>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    /// <summary>
    /// Find a specific announcement
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/announcements/:id
    /// </remarks>
    /// <param name="id">The announcements id</param>
    /// <returns>The announcement</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<Announcement>> Find(long id)
    {
      Announcement announcement = await LookupService<Announcement>.Find(id).ConfigureAwait(false);
      if (announcement == null) return NotFound();
      return Ok(announcement);
    }
  }
}
