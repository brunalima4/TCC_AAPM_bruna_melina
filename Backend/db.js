//meu arquivo de conexão com o banco de dados
const mysql = require('mysql2/promise')

//pool de conexão
const conexao = mysql.createPool({
    //criar as cofigurações do BD
    host:"localhost",
    user:"root",
    password:"",
    port:"3306",
    database:"banco_projeto.sql",
    waitForConnections:true,
    connectionLimit:10,
    queueLimit:0
})
// exportando o arquivo db
module.exports = conexao
