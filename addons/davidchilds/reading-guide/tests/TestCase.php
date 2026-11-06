<?php

namespace Davidchilds\ReadingGuide\Tests;

use Davidchilds\ReadingGuide\ServiceProvider;
use Statamic\Testing\AddonTestCase;

abstract class TestCase extends AddonTestCase
{
    protected string $addonServiceProvider = ServiceProvider::class;
}
