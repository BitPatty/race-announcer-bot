using Microsoft.AspNetCore.Mvc;

namespace RaceAnnouncer.WebAPI.Controllers
{
  /// <summary>
  /// Handles requests on the landing page
  /// </summary>
  [Route("/")]
  [Controller]
  public class HomeController : Controller
  {
    /// <summary>
    /// The landing page
    /// </summary>
    /// <returns>Returns the view of the landing page</returns>
    [HttpGet("/")]
    public IActionResult Index()
    {
      return View("Views/Home.cshtml");
    }
  }
}
