---
title: Sun / Oracle Grid Engine - Exclusive Host Access
summary: How to get each job to have exclusive access to a host in Oracle Grid Engine
date: 2012-01-13
---

I am running a cluster on EC2 (with starcluster) and wanted my jobs to
have exclusive access to nodes (i.e. only one job should run on one node
 at the time). I had to piece this together from different sources and
now almost forgot about it again, so here it goes:

First create a new parallel environment

```
$ qconf -ap your_pe_name
```

The '-ap' stands for add parallel environment, see 'qconf -help' for a list of options.

The following config file comes up, change slots to something big:

```
pe_name            your_pe_name
slots              1024
user_lists         NONE
xuser_lists        NONE
start_proc_args    /bin/true
stop_proc_args     /bin/true
allocation_rule    $pe_slots
control_slaves     FALSE
job_is_first_task  TRUE
urgency_slots      min
accounting_summary FALSE
```

Ok, so now you have created a new parallel environment. Let's add it to a queue. Call

```
$ qconf -mq all.q
```

and add the name of your parallel environment ('your_pe_name' above) to the section
parallel environments.

To submit a job using this parallel environment do
```
$ qsub -pe your_pe_name 4 ./your_job_file.sh
```

The newly submitted job will occupy 4 slots. Adjust so that it occupies
all cores on the machine (if you have 8 cores use 8 instead of 4) and it
 should be the only job that gets run on a machine.
