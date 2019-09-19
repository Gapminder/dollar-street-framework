
workflow "Dollar Street workflow" {
  resolves = ["delivered"]
  on = "status"
}

action "backlog" {
  uses = "backlog"
}

action "selected for development" {
  uses = "selected"
  needs = ["backlog"]
}

action "ready for development" {
  uses = "ready"
  needs = ["selected for development"]
}

action "in development" {
  uses = "in"
  needs = ["ready for development"]
}

action "on review" {
  uses = "on"
  needs = ["in development"]
}

action "ready for testing" {
  uses = "ready"
  needs = ["on review"]
}

action "in testing" {
  uses = "in"
  needs = ["ready for testing"]
}

action "ready fore preview" {
  uses = "ready"
  needs = ["in testing"]
}

action "ready for release" {
  uses = "ready"
  needs = ["ready fore preview"]
}

action "deployed to prod" {
  uses = "deployed"
  needs = ["ready for release"]
}

action "delivered" {
  uses = "delivered"
  needs = ["deployed to prod"]
}
