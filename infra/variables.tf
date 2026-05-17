variable "aws_region" {
  default = "ap-northeast-1"
}

variable "app_name" {
  default = "raisetimeline"
}

variable "env" {
  default = "prod"
}

variable "db_username" {
  description = "RDS master username"
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret"
  sensitive   = true
}
