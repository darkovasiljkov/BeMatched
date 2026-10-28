using System;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace API.Data;


public class MessagesRepository(AppDbContext dbContext) : IMessageRepository
{
    public void AddMessage(Message message)
    {
        dbContext.Messages.Add(message);
    }

    public void DeleteMessage(Message message)
    {
        dbContext.Messages.Remove(message);
    }

    public async Task<Message?> GetMessage(string messageId)
    {
        return await dbContext.Messages.FindAsync(messageId);
    }

    public async Task<PaginatedResult<MessageDto>> GetMessagesForMember(MessageParams messageParams)
    {
        if (messageParams.Container != "Outbox")
        {
            var deliveredAt = DateTime.UtcNow;
            await dbContext.Messages
                .Where(x => x.RecipientId == messageParams.MemberId && !x.RecipientDeleted && x.DateDelivered == null)
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.DateDelivered, deliveredAt));
        }

        var query = dbContext.Messages
            .OrderByDescending(x => x.MessageSent)
            .ThenByDescending(x => x.Id)
            .AsQueryable();
        
        query = messageParams.Container switch
        {
            "Outbox" => query.Where(x => x.SenderId == messageParams.MemberId && !x.SenderDeleted),
            _ => query.Where(x => x.RecipientId == messageParams.MemberId && !x.RecipientDeleted)
        };

        var messageQuery = query.Select(MessageExtensions.ToDtoProjection());

        return await PaginationHelper.CreateAsync(messageQuery, messageParams.PageNumber, messageParams.PageSize);
    }


    public async Task<IReadOnlyList<MessageDto>> GetMessageThread(string currentMemberId, string recipientId)
    {
        var deliveredAt = DateTime.UtcNow;
        await dbContext.Messages
            .Where(x => x.RecipientId == currentMemberId
                     && !x.RecipientDeleted
                     && x.SenderId == recipientId
                     && x.DateDelivered == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.DateDelivered, deliveredAt));

        var readAt = DateTime.UtcNow;
        await dbContext.Messages
            .Where(x => x.RecipientId == currentMemberId
                     && !x.RecipientDeleted
                     && x.SenderId == recipientId
                     && x.DateRead == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.DateRead, readAt));

        return await dbContext.Messages
            .Where(x => (x.RecipientId == currentMemberId
                     && x.SenderId == recipientId && !x.RecipientDeleted)
                     || (x.SenderId == currentMemberId && x.RecipientId == recipientId && !x.SenderDeleted))
                     .OrderBy(x => x.MessageSent)
                     .Select(MessageExtensions.ToDtoProjection())
                     .ToListAsync();
    }


    public async Task<bool> SaveAllAsync()
    {
        return await dbContext.SaveChangesAsync() > 0;
    }
}
