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
        var query = dbContext.Messages
            .OrderByDescending(x => x.MessageSent)
            .AsQueryable();
        
        query = messageParams.Container switch
        {
            "Outbox" => query.Where(x => x.SenderId == messageParams.MemberId),
            _ => query.Where(x => x.RecipientId == messageParams.MemberId)
        };

        var messageQuery = query.Select(MessageExtensions.ToDtoProjection());

        return await PaginationHelper.CreateAsync(messageQuery, messageParams.PageNumber, messageParams.PageSize);
    }


    public async Task<IReadOnlyList<MessageDto>> GetMessageThread(string currentMemberId, string recipientId)
    {
      
        await dbContext.Messages
            .Where(x => x.RecipientId == currentMemberId
                     && x.SenderId == recipientId
                     && x.DateRead == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.DateRead, DateTime.UtcNow)); // will mark message as read before we return to user

        return await dbContext.Messages
            .Where(x => (x.RecipientId == currentMemberId
                     && x.SenderId == recipientId)
                     || (x.SenderId == currentMemberId && x.RecipientId == recipientId))
                     .OrderBy(x => x.MessageSent)
                     .Select(MessageExtensions.ToDtoProjection())
                     .ToListAsync();
    }


    public async Task<bool> SaveAllAsync()
    {
        return await dbContext.SaveChangesAsync() > 0;
    }
}