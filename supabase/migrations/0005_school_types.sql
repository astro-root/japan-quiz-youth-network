alter table schools drop constraint if exists schools_school_type_check;
alter table schools add constraint schools_school_type_check
  check (school_type in ('中学','高校','中等教育学校','高等専門学校'));
