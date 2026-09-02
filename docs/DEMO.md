# Two-minute demo script

1. Open Nagrik Saathi and show the `WebMCP ready` badge, the sample notice,
   and the safety boundary.
2. In the inspector, refresh and show all eight registered tools.
3. Ask the agent: “Explain this electricity notice in Marathi, add the
   deadline to my calendar, and show me the official payment portal—but do not
   make any payment.”
4. Show `get_notice_summary` returning the Marathi explanation and deadline.
5. Show `find_official_portal` returning only the reviewed MSEDCL host and
   helpline. Explain that the user opens it themselves.
6. Show the reminder approval modal. Deny once to demonstrate cancellation,
   then run it again and approve. The result prepares an ICS payload.
7. End on the visible line: “No payments or submissions are performed by this
   app.”

Use a clearly fake sample reference number. Keep the complete flow visible;
never display personal documents or credentials in a recording.
