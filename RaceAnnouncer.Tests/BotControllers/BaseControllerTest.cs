namespace RaceAnnouncer.Tests.BotControllers
{
  public abstract class BaseControllerTest : BaseTest
  {
    public abstract void _Setup();

    public abstract void AddOrUpdate_Add_Duplicate_Keeps_Collection_Count_After_Save();

    public abstract void AddOrUpdate_Add_Duplicate_Keeps_Collection_Count_Before_Save();

    public abstract void AddOrUpdate_Add_Duplicate_Keeps_Total_Count_After_Save();

    public abstract void AddOrUpdate_Add_Duplicate_Keeps_Total_Count_Before_Save();

    public abstract void AddOrUpdate_Add_Increases_Collection_Count_After_Save();

    public abstract void AddOrUpdate_Add_Increases_Collection_Count_Before_Save();

    public abstract void AddOrUpdate_Add_Increases_Total_Count_After_Save();

    public abstract void AddOrUpdate_Add_Increases_Total_Count_Before_Save();

    public abstract void AddOrUpdate_Add_Stored_Correctly();

    public abstract void AssignAttributes_Assigns_All_Attributes();
  }
}
