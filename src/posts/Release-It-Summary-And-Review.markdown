---
title: Release It - Summary and Review
summary: A fairly long summary and short review of Michael Nygard's
         book Release It
date: 2015-01-13
---

So I have finally finished reading Michael Nygard's terribly named but
quite interesting book *Release It*. It covers stability patterns and
anti-patterns and offers some interesting ideas and concepts for
improving stability.


## Part I: Stability

The part on stability starts out with an interesting case study that
describes how an uncaught exception in a connection pool caused the
flight search application of an airline to hang which in turn caused a
failure in all check-in systems. The uncaught exception was a
programming error, but some errors will inevitably occur. However,
these errors must not bring down the entire IT infrastructure of a
company! It is thus critical to identify how small errors can cause
entire applications to fail and what can be done to mitigate the
spread of such failures. The former is examined in 'Stability
Antipatterns', the latter in 'Stability Patterns'.

### Stability Antipatterns

 1. Integration Points

    Problems are often caused at integration points b/c the
    remote application may not always act as specified. There
    is a huge number of failure modes simply connected to TCP
    connections that an application must protect against if
    it integrates other applications.

    - Every integration point will eventually fail in some way.

    - There are many forms of failure

    - Peel back abstractions to discover failure modes

    - Failures can propagate quickly - stop them!

    - Use stability patterns to mitigate: Timeouts, Circuit Breaker,
      Decoupling Middleware, Handshaking


 2. Chain Reactions

    Occur when a failure somewhere makes failures somewhere else
    more likely, but do not causes this directly. For example when
    one server dies due to a memory leak and other servers must pick
    up the extra traffic these servers will be more likely to go
    down due to the same leak because they now must deal with more
    traffic.

    - One server down jeopardizes the rest

    - Hunt for resource leaks & timing bugs

    - Defend with bulkheads


 3. Cascading Failures

    Cascading failures happen when failures are one system can jump to
    the next system. For example, if a hung server somewhere causes
    client applications to hang because they wait for responses that
    never come (While they clearly cannot display a response then they
    should deal with not receiving one in time).

    - Deal with failures in remote systems

    - Scrutinize resource pools

    - Defend with Timeout and Circuit Breaker


 4. Users

    This deals with te resources that users use. For example memory
    used up for a user session.

    - Users consume memory

    - Users do weird things

    - Malicious users are out there

    - Users will gang up on you


 5. Blocked Threads

    Threads waiting for responses or resources to free up which
    never or are very slow to come or free up can cause the
    application to hang.

    Blocked threads can also be caused by deadlocks resulting from
    concurrency errors. This is obviously a large and complicated
    topic.

    - Blocked threads are the proximate cause of most system failures

    - Scrutinize resource pools

    - Use proven concurrency primitives (FP!!!)

    - Use Timeouts

    - Beware of vendor libraries.


 6. Attacks of Self-Denial

    E.g. deep-links which require sessions and a lot of internal
    requests of extremely attractive offers on shopping sites.
    Educate the marketing department.

    - Keep lines of communication open

    - Expect rapid redistribution of any valuable offer


 7. Scaling Effects

    Communication patterns that may have been fine with two servers
    might not scale (e.g. O(n) or worse connections required).

    - Examine production vs QA and dev environment to spot scaling
      effects.

    - Watch out for point-to-point communcation

    - Watch out for shared resources


 8. Unbalanced Capacities

    E.g. larger front-end capacities can overwhelm smaller back-end
    capacities

    - Examine server and thread counts

    - Stress both sides of the interface


 9. Slow Responses

    Extremely slow responses cna prevent timeouts from working yet
    have much the same effect as not receiving a response.

    - Slow responses trigger *Cascading Failures*: upstream systems also
      slow down.

    - Users will hit the reload button -> more traffic.

    - Consider to *Fail Fast*.

    - Hunt for memory leaks and resource contention.


10. SLA Inversion

    The availability of a set of system is the product of their
    availabilities. Thus a system depending on five other systems
    which each provide a 99% guarantee can only guarantee 99%^5=95.1%
    availability.

    - Examine every dependency: DNS, Email, network equipment, database, ...

    - Decouple dependencies: Make sure you can maintain service even
      when dependencies go down.


11. Unbounded Result Sets

    Applications should also be more sceptical of their databases and
    e.g. limit the number of results that they are willing to process.

    - Limit to realistic data volumes.

    - Don't rely on the producer, enforce limits yourself.

    - Put limits into other application level protocols.


### Stability Patterns

  1. Use Timeouts

     Hung threads waiting for responses that may never come or come
     slowly can lead the entire application to block (all threads
     in a pool are hung). Use timeouts to report an error when this
     happens.

     - Apply to *Integration Points*, *Blocked Threads*, *Slow Responses*.

     - Give up and keep moving: it may not matter if we ge a response
       eventually, time is of the essence.

     - Delay retries: Most timeouts are caused by things that don't resolve
       imediately, wait a little before trying again.


  2. Circuit Breaker

     A circuit breaker detects when there is a problem at an integration
     point and acts accordingly. A circuit breaker counts the number of
     failures, if these exceed a sensible threshold it triggers and prevents
     subsequent calls to talk to the integration point. After a timeout
     a single / few call(s) may be retried, if they work the circuit breaker
     goes back to its normal state, if not it stays open.

     - If there is a problem with an integration point stop calling it!

     - Use together with *Timeouts*: A *Timeout* detects the problem, a
       *Circuit Breaker* keeps us from retrying too often too soon.

     - Make it visible to operations: popping a *Circuit Breaker* usually
       indicates a serious problem.


  3. Bulkheads

     Bulkheads partition the system into independent units. When one
     unit fails the other units are still operational. There are trade-offs
     with efficient resource usage.

     - Very important when other applications depend on your system:
       the largest part should keep functioning when there is some
       problem.


  4. Steady State

     Applications should be able to run indefintely without requireing
     human interventions. The latter leads to fiddeling, which causes
     errors. This inlcudes cleaning up log-files and disk space at the
     same rate that they are produced.

     - Avoid human interaction, it causes problems.

     - Purge data with application logic (e.g. DB entries).

     - Limit caching.

     - Roll logs.


  5. Fail Fast

     This pattern deals with the problems caused by 'slow responses'.
     An application should determine as soon as possbile if it can
     service a request and if not it should fail as quickly as
     possible. There are some trade offs with maintaining
     encapsulation here.

     - Verify integration points early: If required resources are not
       available it's time to fail fast.

     - Validate input as early as possible.


  6. Handshaking

     Can be used to determine if an application can accept additional
     requests. This does double the number of requests and request-latency.
     Building in the ability to reject requests directly seems more useful
     to me.


  7. Test Harness

     A sufficiently evil test harness can test the response of an application
     to misbehaving integration points. It is the point of this test harness
     to test failure modes which are not specified. For example misbehaving
     TCP connections or extremely slow responses can be tested with such a
     test harness.

     Consider the following network failures:

     - It can be refused.

     - It can sit in a listen queue until the caller times out.

     - The remote end can reply with a SYN/ACK and then never send any data.

     - The remote end can send nothing but RESET packets.

     - The remote end can report a full receive window and never drain
       the data.

     - The connection can be established, but the remote end never
       sends a byte of data.

     - The connection can be established, but packets could be lost
       causing retransmit delays.

     - The connection can be established, but the remote end never
       acknowledges receiving a packet, causing endless retransmits.

     - The service can accept a request, send response headers
       (supposing HTTP), and never send the response body.

     - The service can send one byte of the response every thirty
       seconds.

     - The service can send a response of HTML instead of the expected
       XML.

     - The service can send megabytes when kilobytes are expected.

     - The service can refuse all authentication credentials.


     Remember these:

     - Emulate out-of-spec failures

     - Stress the caller: Slow responses, no responses, garbage responses

     - Leverage a killer harness for common failures

     - Supplement, don't replace, other testing methods


  8. Decoupling Middleware

     Asynchronous middleware (e.g. Pub-Sub or messaging communication
     solutions) force the programmers with the possibility of not
     receiving a response right away and thus make systems more resilient.
     They are more difficult to work with than synchronous middleware
     (but represent the underlying architecture more correctly).

     - Total decoupling can avoid many failure modes.

     - Learn many architectures, choose the best one for the job.



## Part II: Capacity

Another case study rings in the part on capacity: This one is on an
online retailer that re-build their system from scratch over three
years. When entering load testing it didn't meet capacity requirements
by a factor of 20, after months of testing this imporoved ten-fold.

It crashed badly when it went live, because all the tests had been
simulating *nice* users: users that used the site how it was meant
to. In the real world a lot of bots, search engines and other things
used the site in non-anticipated ways which it was not prepared for.


### Introducing Capacity

  1. Defining Capacity

     Performance: How fast does the system process a single transaction?

     Throughput: Number of transactions the system can process in a
     given timespan.

     Scalability: Used to describe either (a) how throughput changes
     under different loads or (b) modes of scaling supported by the system.

     Capacity: maximum throughput a system can sustain while meeting
     performance criteria (e.g. response time).


  2. Constraints

     Aka bottlenecks. At any given point, there will usually one (or
     more) things constraining capacity. Improving any other factors
     will not yield more capacity.


  3. Interrelations

     Things are not independent. Decreased performance in one layer
     can affect other layers.


  4. Scalability

     Horizontal vs. vertical scaling.


  5. Myths About Capacity

     While hardware as such (compared to programmer time) is cheap,
     dealing with inefficiencies can become more
     expensive. Optimization may still make sense.  All of CPU,
     storage and bandwith may be more expensive than it seems at first
     sight.


### Capacity Antipatterns

  1. Resource Pool Contention

     Requests waiting for resources to become available are a
     scalability problem.


  2. Excessive JSP fragments

     Java specific. JSP fragments reside in memory and can constrain
     application server memory.


  3. Ajax Overkill

     Ajax can be used to hammer a server. Don't build an essantially
     static homepage with 100 Ajax requests.


  4. Overstaying Sessions

     Sessions memory and are removed with the timeout after user goes
     away. Should not be kept longer than necessary. Ideal: Information
     for user is still available even when session expires.


  5. Wasted Space in HTML

     Can add up.


  6. The Reload Button

     Slow requests increase load by causing users to hammer the reload
     button.


  7. Handcrafted SQL

     In Java land thy shall not work without an ORM.


  8. Database Eutrophication

     The database becomes bigger over time, so things that were OK at
     on point might not always be.


  9. Integration Point Latency

     Integration points take time to respond and latency adds up.


  10. Cookie Monsters

      Large cookies must be transfered back and forth a lot. Can't be
      trusted.


### Capacity Patterns

  1. Pool Connections

     Creating a new connection can take upwards of 250ms. So pooling
     makes sense. Some considerations:

     - connections with an error must be detected and fixed

     - for which scope should connections be checked out?


  2. Use Caching Carefully

     It's a trade off, caching things that are seldomly used and
     not expensive to generate doesn't make sense.


  3. Precompute Content

     When it changes much less frequently than it is requested (and
     it's worth the effort).


  4. Tune the GC

     JVM specific. GC should ideally take no more than 2% of time.


## Part III: General Design Issues

### Networking

  1. Multihomed Servers: Contrary to the setup in dev and QA, servers
     will listen on multiple IPs, not all of them public. This must
     be accounted for in development.

  2. Routing: Different NICs might be on different VLANs, remote backend
     services might require connection through a VPN. Must pay attention
     to every integration point.

  3. Virtual IP Addresses: Cluster servers, some info on how virtual
     IP addresses can be moved from one NIC to another.

### Security

  1. Principle of Least Privilege: Processes should have as few
     privledges as possible.

  2. Configured Passwords: Should be kept separate from other
     configuration files, core dumps should be disabled for
     production (trade-offs ...).


### Availability

1. Gathering Availability Requirements: High availability costs
   money and the requirements must thus be balanced with the costs.
   Rule of thumb: Each additional '9' increases the implementation
   cost by a factor of 10 and the operational cost by a factor of 2.

2. Documenting Availability Requirements: Once things go down everyone
   has a different opinion of what available was defined to
   mean. Important to really define it. Availability should be defined
   per feature and not be responsible for remote systems one has no
   control over. A good definition might answer the following questions:

   - How often will the monitoring device execute its synthetic transaction?

   - What is the maximum acceptable response time for each step of the
     transaction?

   - What response codes or text patterns indicate success?

   - What response codes or text patterns indicate failure?

   - How frequently should the synthetic transaction be executed?

   - From how many locations?

   - Where will the data be recorded?

   - What formula will be used to compute the percentage availability? Based
     on time or number of samples?

3. Load Balancing

  - DNS Round-Robin: Several IPs configured for a domain name, DNS
    returns a different one each time, thus distributing load over the
    IPs.

    Several problems: server IPs must be public (instead of some
    proxy), too much control over load balancing in clients hands,
    workloads might still be unbalanced, no failover in case one
    server goes down. Url rewriting variant with Apache
    (www7.example.com) even worse.

  - Reverse Proxy: intercepts each requests and multiplexes it onto a
    number of servrs behind it, can cache static content, examples:
    Squid, Akamai.

  - Hardware Load Balancer: specialized networking gear, expensive,
    SSL a challenge (terminating SSL at the load balancer puts it under
    a lot of stress).

4. Clustering: Unlike in load balancing servers are aware of each. Can
   be used for load balancing (active/active) or failover. Do not
   scale linearly like load-balanced shared nothing architectures.
   Nygard considers them a band-aid for applications that don't do
   clustering / scaling themselves.


### Administration

Easy administration leads to good uptime.

 1. Does QA match Production?

    Most often it doesn't. Differences in topology responsible for
    many outages. It's advantageous to maintain a similar topology
    (e.g. seperation of services through firewalls, same multiplicty
    of connections) in QA as in production.

    The cost of downtime often exceeds the cost of the extra network
    gear required to run the same setup in QA and in
    production. Pennywise and pound foolish?

 2. Configuration Files

    Don't keep configuration settings that must be changed by sys admins
    next to the essential (hard-wired) configuration for the application.

    Name configuration properties according to their function,
    e.g. 'authenticationServer' instead of 'hostname'.

 3. Start-up and Shutdown

    Applications should start up and shut down cleanly and do some
    minimal checks that they are configured correctly before accepting
    work (Fail Fast).

 4. Administrative Interfaces

    GUIs look nice but command line interfaces are essential for
    automation.


## Part IV: Operations

### Transparency

Transparency allows to gain an understanding of historical trends,
present conditions and future projections. Transparency has four
facets: historical trends, predictive forecasting, present status
and instantaneous behaviour.

 1. Perspectives

    - Historical Trending

      * Records have to be stored somewhere -> OpsDB

      * Can be used to discover new relationships - should be available
        through tools such as Excel.

    - Forecasts

      * What's the capacity?

      * When do we have to buy more servers?

    - Present Status

      * Memory

      * Garbage Collection

      * Worker threads for each thread pool

      * Database connections, for each pool

      * Traffic statistics for each request channel

      * Business transactions for each type

      * Users: demographics, percentage registered, number of users,
        usage patterns

      * Integration points: current state, times used, latency statistics,
        error count.

      * Circuit breakers: current state, error count, latency statistics,
        number of state transitions.

      The current state can be displayed on a dashboard, e.g. as a traffic
      light for the system and each component.

    - Instantaneous Behaviour: WTF is going on???

      Errors, log file entries, thread dumps, ... Can, but may not
      immediately show up in *Present Status*.

 2. Desiging for Transparency

    Transparency is hard to add later. Both local and global visibility
    is necessary.

 3. Enabling Technologies: White box (visibility into the processes)
    vs. black box (only externally visible metrics)

 4. Logging

    * Make log file output easy to scan with the eye (p. 246)


 5. Monitoring Systems

 6. Standards, De Jure and De Facto

    - Simple Network Management Protocol: De Facto standard, ASN.1 a
      bit awkward.

    - JMX (Java Management Extensions) de facto standard in the Java
      world.


 7. Operations Database

    Good for historical data, forecasts and current status. Not well suited
    for instantaneous behavior. Receives reports from applications, servers
    and batch jobs.

    - Applications: status variables, business metrics, internal metrics

    - Servers: performance, utilization

    - Batch Jobs: start, end, abort, completion status, items processed

    The OpsDB can be used to produce a dashboard, various reports and
    for planning capacity.

    Observations should record their type, the measurement, the event
    and the status.


 8. Supporting Processes

    Must stay in feedback loop when providing data - automated report
    that nobody reads are **worse than useless**: The cost time and
    money to create and maintain and provide a false sense of security,
    yet nobody reads them.

### Adaption

 1. Adaptation Over Time

 2. Adaptable Software Desgin

    - Dependency Injection: enables loose coupling, aids testability

    - Object Design: Claim: it exists ;)

    - XP Coding Practices: Unit testing

    - Agile Databases:

      * databases must be able to change

 3. Adaptable Enterprise Architecture

    Prefer loosely clustered, somewhat independent services that can
    change independently

    - Dependencies Between Systems: Protocols

      Simultaneous updates at several endpoints is hard, this can be
      avoided by speaking multiple protocols (or versions of) for
      a limited time.

    - Dependencies Between Systems: Databases

      Don't share databases between services!!!

 4. Releases Shouldn't Hurt

    Painful releases mean software is released seldomly, automated,
    zero downtime releases rock!


## My Takeaway

Apart from the title, I really did like this book and enjoyed reading
it. I found the chapters on stability (anti-)patterns to be very
valuable and enlightening. These are patterns that I will definteley
introduce in my daily work and as such, even one successful pattern is
worth many times the price of the book.

Almost inevitably, the other parts of the book were not quite able to
deliver as much useful insights but many had some interesting tidbits
nevertheless. While some chapters are a little light on information
(e.g. Security and Networking), others (e.g. Transparency) provide
useful ideas that will make you think of practical concerns while
designing an application. I have certainly seen a number of systems
that failed to deliver on every item discussed in the book.^[Building
a perfectly designed application that delivers on all fronts is much
more difficult in practice than in theory of course. ;)]. Some topics
are covered on a fairly high level and can thus not provide the
nitty-gritty detail needed when dealing with the discussed topics
hands on, but this is inevitable when trying to cover such a broad
range of topics.

All in all I did enjoy the book and recommend it. If you're short on
time I recommend focussing on the part on stability, particularly
chapters 3, 4 and 5 which delivered the most value for me.