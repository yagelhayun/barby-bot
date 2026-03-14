create table artists (
    id integer generated always as identity primary key,
    name text not null,
    chat_id text not null
);

insert into artists (name, chat_id) values
('טונה', '-1003344458982'),
('יוני בלוך', '-5046532501'),
('דודו טסה', '-5173195313');
