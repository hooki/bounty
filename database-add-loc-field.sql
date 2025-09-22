-- 프로젝트 테이블에 LoC (Lines of Code) 필드 추가

ALTER TABLE projects ADD COLUMN total_lines_of_code INTEGER DEFAULT 0;