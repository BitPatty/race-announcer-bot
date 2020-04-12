using System;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RaceAnnouncer.Schema.Models;
using RaceAnnouncer.WebAPI.Payloads;
using RaceAnnouncer.WebAPI.Services;

namespace RaceAnnouncer.WebAPI.Controllers
{
  [Route("api/trackers")]
  [ApiController]
  public class TrackerController : ControllerBase
  {
    [HttpGet]
    public async Task<ActionResult<PagedResult<Tracker>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
    )
    {
      return await LookupService<Tracker>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Tracker>> Find(int id)
    {
      Tracker tracker = await LookupService<Tracker>.Find(id).ConfigureAwait(false);
      if (tracker == null) return NotFound();
      return Ok(tracker);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<Tracker?>> Create(CreateTrackerRequest request)
    {
      try
      {
        Tracker tracker = await TrackerService
          .CreateTracker(request.ChannelId, request.GameId)
          .ConfigureAwait(false);

        return Created($"api/trackers/{tracker.Id}", tracker);
      }
      catch (InvalidOperationException ex)
      {
        return Problem(ex.Message, statusCode: (int)HttpStatusCode.Conflict);
      }
      catch (ArgumentException ex)
      {
        return Problem(ex.Message, statusCode: (int)HttpStatusCode.BadRequest);
      }
    }
  }
}
