"SELECT t.title, t.assigned_to_team_id, tm.name as team_name FROM tasks t LEFT JOIN teams tm ON t.assigned_to_team_id = tm.id LIMIT 10;" 
