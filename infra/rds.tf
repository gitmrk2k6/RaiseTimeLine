resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet"
  subnet_ids = [aws_subnet.private_1a.id, aws_subnet.private_1c.id]
  tags       = { Name = "${var.app_name}-db-subnet-group" }
}

resource "aws_db_instance" "main" {
  identifier              = "${var.app_name}-db"
  engine                  = "postgres"
  engine_version          = "17.2"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  db_name                 = "raisetimeline"
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  skip_final_snapshot     = true
  deletion_protection     = false
  publicly_accessible     = false
  backup_retention_period = 7

  tags = { Name = "${var.app_name}-db" }
}
