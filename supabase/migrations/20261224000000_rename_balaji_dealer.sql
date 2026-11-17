-- Correct truncated dealer name: "Sri Balaji Mutually Aided Coo" ->
-- "Sri Balaji Mutually Aided Coop.Society Ltd" (IFMS 1098224, Chennur, Mancherial).
update public.dealers
set dealer_name = 'Sri Balaji Mutually Aided Coop.Society Ltd'
where dealer_name = 'Sri Balaji Mutually Aided Coo';
