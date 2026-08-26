using Microsoft.EntityFrameworkCore;

namespace API.Helpers;

public class PaginatedResult<T>
{
    public PaginationMetadata Metadata { get; set; } = default!;

    public List<T> Items {get; set;} = [];
};

public class PaginationMetadata
{
    public int CurrentPage { get; set;}

    public int TotalPages { get; set; }

    public int PageSize { get; set; }

    public int TotalCount { get; set; }
};

public class PaginationHelper {
    public static async Task<PaginatedResult<T>> CreateAsync<T>(IQueryable<T> query, int pageNumber, int pageSize)
    {
        var count = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResult<T>
        {
            Metadata = new PaginationMetadata
            {
                CurrentPage = pageNumber,
                TotalPages = (int)Math.Ceiling(count / (double)pageSize), // If we have 25 record and / them with 10, then total pages will be 2.5 but with ceiling 3 so 3 pages for 2.5 records
                PageSize = pageSize,
                TotalCount = count
            },
            Items = items
        };
    }

}
