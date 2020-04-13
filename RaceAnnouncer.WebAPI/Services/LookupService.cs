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
  /// <summary>
  /// Allows for basic paginated requests on any <see cref="BaseEntity"/>
  /// </summary>
  /// <typeparam name="T"></typeparam>
  public static class LookupService<T> where T : BaseEntity
  {
    /// <summary>
    /// Paginates the entries
    /// </summary>
    /// <param name="pageNumber">The page number</param>
    /// <param name="pageSize">The page size</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>Returns the paginated result</returns>
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

    /// <summary>
    /// Finds a single entry in the specified table
    /// </summary>
    /// <param name="id">The entries id</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>Returns the entry if a match is found</returns>
    public static async Task<T> Find(long id, CancellationToken cancellationToken = default)
    {
      cancellationToken.ThrowIfCancellationRequested();
      using DatabaseContext context = new ContextBuilder().CreateDbContext();
      return await context.Set<T>().SingleOrDefaultAsync(s => s.Id.Equals(id)).ConfigureAwait(false);
    }
  }
}
