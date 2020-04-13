using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using cloudscribe.Pagination.Models;
using Microsoft.EntityFrameworkCore;
using RaceAnnouncer.Common;
using RaceAnnouncer.Schema;
using RaceAnnouncer.Schema.Models.BaseModels;

namespace RaceAnnouncer.WebAPI.Services
{
  public static class LookupService<T> where T : BaseEntity
  {
    public static async Task<PagedResult<T>> Paginate(int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
      cancellationToken.ThrowIfCancellationRequested();

      int offset = (pageSize * pageNumber) - pageSize;

      using DatabaseContext context = new ContextBuilder().CreateDbContext();

      return new PagedResult<T>
      {
        Data = await context
        .Set<T>()
        .OrderByDescending(t => t.Id)
        .Skip(offset)
        .Take(pageSize)
        .ToListAsync()
        .ConfigureAwait(false),

        TotalItems = await context
        .Set<T>()
        .CountAsync()
        .ConfigureAwait(false),

        PageNumber = pageNumber,
        PageSize = pageSize
      };
    }

    public static async Task<T> Find(long id, CancellationToken cancellationToken = default)
    {
      cancellationToken.ThrowIfCancellationRequested();
      using DatabaseContext context = new ContextBuilder().CreateDbContext();
      return await context.Set<T>().SingleOrDefaultAsync(s => s.Id.Equals(id)).ConfigureAwait(false);
    }
  }
}
