<#
.SYNOPSIS
Builds the three production images (web, api, ai) and, with -Push, pushes them to AWS ECR.

.DESCRIPTION
Images are tagged <Registry>/<Repository>:<name>-<Tag>, e.g. ...dhi_tech_forum:api-3f2a1bc.
The tag defaults to the current git commit, so every pushed image maps to exact code.
Pushing needs ECR push access: the AWS CLI configured (`aws configure`), or, without the CLI,
a -AwsEnvFile with the keys (the CLI then runs from the amazon/aws-cli Docker image).

.EXAMPLE
./deploy/build-and-push.ps1                 # build only, to test locally
./deploy/build-and-push.ps1 -Push           # build and push to ECR
./deploy/build-and-push.ps1 -Push -Platform linux/arm64   # for an ARM (Graviton) server
./deploy/build-and-push.ps1 -Push -AwsEnvFile C:\secrets\aws.env   # no AWS CLI installed
#>
param(
    [string]$Registry = '464092293482.dkr.ecr.ap-south-1.amazonaws.com',
    [string]$Repository = 'dhi_tech_forum',
    [string]$Tag = '',
    [string]$Platform = 'linux/amd64',
    [switch]$Push,
    # File with AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY lines, for machines without the AWS CLI. Keep it outside the repo.
    [string]$AwsEnvFile = ''
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Invoke-Checked([string]$Exe, [string[]]$Arguments) {
    # Docker writes progress to stderr; Windows PowerShell would treat that as an error under 'Stop'.
    $ErrorActionPreference = 'Continue'
    & $Exe @Arguments 2>&1 | ForEach-Object { "$_" }
    if ($LASTEXITCODE -ne 0) { throw "'$Exe $($Arguments -join ' ')' failed (exit code $LASTEXITCODE)." }
}

if (-not $Tag) {
    $Tag = (git rev-parse --short HEAD).Trim()
    if (git status --porcelain) {
        if ($Push) { throw 'There are uncommitted changes. Commit them first so the image tag matches the code.' }
        $Tag += '-dirty'
    }
}

$images = @(
    @{ Name = 'web'; Context = 'frontend'; Extra = @('--target', 'prod') },
    @{ Name = 'api'; Context = 'backend'; Extra = @('-f', 'backend/api/Dockerfile.prod') },
    @{ Name = 'ai'; Context = 'backend/ai-service'; Extra = @() }
)
$refs = @{}
foreach ($image in $images) {
    $ref = "$Registry/${Repository}:$($image.Name)-$Tag"
    $refs[$image.Name] = $ref
    Write-Host "==> Building $ref ($Platform)" -ForegroundColor Cyan
    Invoke-Checked 'docker' (@('build', '--platform', $Platform, '-t', $ref) + $image.Extra + @($image.Context))
}

if ($Push) {
    $region = ($Registry -split '\.')[3]
    Write-Host "==> Logging in to $Registry" -ForegroundColor Cyan
    if ($AwsEnvFile -or -not (Get-Command aws -ErrorAction SilentlyContinue)) {
        # No AWS CLI installed: run it from its Docker image, with keys from -AwsEnvFile or the current environment.
        $credentials = if ($AwsEnvFile) { "--env-file `"$AwsEnvFile`"" } else { '-e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN' }
        $getPassword = "docker run --rm $credentials amazon/aws-cli ecr get-login-password --region $region"
    } else {
        $getPassword = "aws ecr get-login-password --region $region"
    }
    # Pipe through cmd: a Windows PowerShell pipe alters the token and ECR answers "400 Bad Request".
    Invoke-Checked 'cmd' @('/c', "$getPassword | docker login --username AWS --password-stdin $Registry")

    foreach ($image in $images) {
        Write-Host "==> Pushing $($refs[$image.Name])" -ForegroundColor Cyan
        Invoke-Checked 'docker' @('push', $refs[$image.Name])
    }
}

Write-Host ''
Write-Host $(if ($Push) { 'Pushed. Send these lines to DevOps for the server .env:' } else { 'Built (not pushed). Image names:' }) -ForegroundColor Green
Write-Host "WEB_IMAGE=$($refs['web'])"
Write-Host "API_IMAGE=$($refs['api'])"
Write-Host "AI_IMAGE=$($refs['ai'])"
