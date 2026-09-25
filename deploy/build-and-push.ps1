<#
.SYNOPSIS
Builds the three production images (web, api, ai) and, with -Push, pushes them to AWS ECR.

.DESCRIPTION
Images are tagged <Registry>/<Repository>:<name>-<Tag>, e.g. ...dhi_tech_forum:api-3f2a1bc.
The tag defaults to the current git commit, so every pushed image maps to exact code.
Pushing needs the AWS CLI configured with ECR push access (`aws configure`).

.EXAMPLE
./deploy/build-and-push.ps1                 # build only, to test locally
./deploy/build-and-push.ps1 -Push           # build and push to ECR
./deploy/build-and-push.ps1 -Push -Platform linux/arm64   # for an ARM (Graviton) server
#>
param(
    [string]$Registry = '464092293482.dkr.ecr.ap-south-1.amazonaws.com',
    [string]$Repository = 'dhi_tech_forum',
    [string]$Tag = '',
    [string]$Platform = 'linux/amd64',
    [switch]$Push
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
    $ErrorActionPreference = 'Continue'
    $password = aws ecr get-login-password --region $region
    if ($LASTEXITCODE -ne 0) { throw 'AWS login failed. Run "aws configure" with the ECR credentials from DevOps.' }
    $password | docker login --username AWS --password-stdin $Registry 2>&1 | ForEach-Object { "$_" }
    if ($LASTEXITCODE -ne 0) { throw 'docker login to ECR failed.' }
    $ErrorActionPreference = 'Stop'

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
