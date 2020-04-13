using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace RaceAnnouncer.WebAPI.Controllers
{
  [Route("/")]
  [Controller]
  public class HomeController : Controller
  {
    [HttpGet("/")]
    [Route("/index")]
    public IActionResult Index()
    {
      return View("Views/Home.cshtml");
    }
  }
}
