---
title: Know how your AI finds its answers
description: Two projects, one lesson. Building retrieval yourself with RAG, and getting more from the search your AI tool already has.
date: 2026-11-10
tags: [RAG, Azure, AI adoption]
cover: retrieval
---

Most people use AI like a smarter search bar. The real value shows up when you understand how it finds its answers.

I've been building two projects to dig into that.

## 1. Grounding answers in real data (RAG)

Guild Wars 2 has more than 8,000 achievements. Ask a general chatbot about one and it will often sound confident while being wrong. So I built an assistant that looks the answer up before it speaks.

It pulls achievement data, breaks it into searchable pieces, and stores it in Azure AI Search. When you ask a question, it runs a hybrid search (keyword and meaning together), hands the best matches to Azure OpenAI, and answers only from what it found. It's built with .NET 10 and Microsoft Agent Framework.

**The lesson:** the model is only as good as what you give it to read. Retrieval is where the quality comes from.

## 2. Knowing your search agent

My mom runs a luxury travel agency, and trip research eats hours. I built her a trip desk tool as a Claude artifact that researches destinations, hotels, and itineraries through Claude's own search.

**The lesson:** you don't always need to build the search yourself. You need to understand how your AI tool searches, what it can reach, and how to ask so it pulls the right sources. Once you know that, the tool you already pay for gets much more useful.

## Why this matters

AI adoption isn't about replacing people. It's about giving them back the hours spent digging. A travel advisor gets more time with clients. A player gets a straight answer. An engineer gets to focus on the hard problems.

If you're not sure where to start, pick one task you repeat every week and ask: what would I need to look up to do this? That's your first AI use case.

I'll keep sharing what I build under Crimson Compass. What's one task you'd hand to AI tomorrow?
