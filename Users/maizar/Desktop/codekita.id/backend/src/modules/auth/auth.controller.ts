@IsPublic()
  @Post(\"login\")
  @HttpCode(200)
  async login(
    @Body() body: { identifier: string; password: string },
    @Req() request: any,
    @Res() reply: any,
  ) {
    const result = await this.authService.login(
      body.identifier,
      body.password,
      request.ip,
      request.headers[\"user-agent\"],
    );