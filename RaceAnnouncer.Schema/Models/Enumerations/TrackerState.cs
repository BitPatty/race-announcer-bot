using System;
using System.Collections.Generic;
using System.Text;

namespace RaceAnnouncer.Schema.Models.Enumerations
{
  public enum TrackerState : uint
  {
    /// <summary>
    /// The trackers state is unknown
    /// </summary>
    Unknown = 0,

    /// <summary>
    /// The tracker was created but is not active
    /// </summary>
    Created = 1,

    /// <summary>
    /// The tracker is active
    /// </summary>
    Active = 2,

    /// <summary>
    /// The tracker is paused
    /// </summary>
    Paused = 3,

    /// <summary>
    /// The tracker was deactivated
    /// </summary>
    Dead = 4
  }
}
