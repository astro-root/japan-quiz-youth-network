create or replace function admin_promote_all_grades()
returns void as $$
begin
  update affiliations a
  set grade_at_time = p.grade
  from profiles p
  where a.user_id = p.id and a.ended_on is null;

  update profiles p
  set needs_reaffiliation = true
  from schools s
  where p.school_id = s.id
    and p.status = 'student'
    and s.school_type = '中学'
    and p.grade = 3;

  update affiliations a
  set ended_on = current_date
  from profiles p
  join schools s on s.id = p.school_id
  where a.user_id = p.id and a.ended_on is null
    and p.status = 'student'
    and (
      (s.school_type = '高校' and p.grade = 3) or
      (s.school_type = '中等教育学校' and p.grade = 6) or
      (s.school_type = '高等専門学校' and p.grade = 5)
    );

  update profiles p
  set status = 'alumni'
  from schools s
  where p.school_id = s.id
    and p.status = 'student'
    and (
      (s.school_type = '高校' and p.grade = 3) or
      (s.school_type = '中等教育学校' and p.grade = 6) or
      (s.school_type = '高等専門学校' and p.grade = 5)
    );

  update profiles p
  set grade = p.grade + 1
  from schools s
  where p.school_id = s.id
    and p.status = 'student'
    and not (
      (s.school_type = '高校' and p.grade = 3) or
      (s.school_type = '中等教育学校' and p.grade = 6) or
      (s.school_type = '高等専門学校' and p.grade = 5) or
      (s.school_type = '中学' and p.grade = 3)
    );
end;
$$ language plpgsql security definer;
