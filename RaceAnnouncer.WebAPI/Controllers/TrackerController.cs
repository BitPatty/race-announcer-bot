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
  /// <summary>
  /// Handles requests on the /api/trackers endpoint
  /// </summary>
  [Route("api/trackers")]
  [ApiController]
  public class TrackerController : ControllerBase
  {
    /// <summary>
    /// List trackers
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/trackers
    /// </remarks>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size (1-10)</param>
    /// <returns>The paginated tracker list</returns>
    [HttpGet]
    public async Task<ActionResult<PagedResult<Tracker>>> Get(
      [FromQuery(Name = "pageNumber"), Range(1, int.MaxValue)] int pageNumber = 1
      , [FromQuery(Name = "pageSize"), Range(1, 10)] int pageSize = 10
    )
    {
      return await LookupService<Tracker>.Paginate(pageNumber, pageSize).ConfigureAwait(false);
    }

    /// <summary>
    /// Find a specific tracker
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     GET /api/trackers/:id
    /// </remarks>
    ///  /// <param name="id">The trackers id</param>
    /// <returns>The tracker</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<Tracker>> Find(long id)
    {
      Tracker tracker = await LookupService<Tracker>.Find(id).ConfigureAwait(false);
      if (tracker == null) return NotFound();
      return Ok(tracker);
    }

    /// <summary>
    /// Create a new tracker
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     POST /api/trackers
    ///     {
    ///         "gameId": 1,
    ///         "channelId": 3
    ///     }
    /// </remarks>
    /// <param name="request">The request body</param>
    /// <returns>Returns the created tracker</returns>
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

    /// <summary>
    /// Update a tracker
    /// </summary>
    /// <remarks>
    /// Sample request:
    ///     POST /api/trackers
    ///     {
    ///         "gameId": 1,
    ///         "channelId": 3
    ///     }
    /// </remarks>
    /// <param name="request">The request body</param>
    /// <param name="id">The trackers id</param>
    /// <returns>Returns the updated tracker</returns>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<Tracker?>> UpdateTracker(UpdateTrackerRequest request, long id)
    {
      try
      {
        Tracker tracker = await TrackerService
          .UpdateTracker(id, request.GameId, request.ChannelId)
          .ConfigureAwait(false);

        return Ok(tracker);
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
