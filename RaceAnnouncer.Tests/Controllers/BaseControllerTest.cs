namespace RaceAnnouncer.Tests.Controllers
{
  public abstract class BaseControllerTest : BaseTest
  {
    public abstract void _Setup();

    public abstract void AddOrUpdate_Add_Duplicate_Keeps_Count();

    public abstract void AddOrUpdate_Add_Increases_Count();

    public abstract void AddOrUpdate_Add_Stored_Correctly();

    public abstract void AssignAttributes_Assigns_All_Attributes();
  }
}
