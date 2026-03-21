create table artists (
    name text not null primary key,
    chat_id text not null unique
);

insert into artists (name, chat_id) values
('טונה', '-1003344458982'),
('יוני בלוך', '-5046532501'),
('דודו טסה', '-5173195313');
